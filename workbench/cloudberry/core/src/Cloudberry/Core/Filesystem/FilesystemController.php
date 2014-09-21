<?php

namespace Cloudberry\Core\Filesystem;

use \Cloudberry\Core\Permissions\PermissionController;

class FilesystemController {
	const PERMISSION_LEVEL_NONE = "n";
	const PERMISSION_LEVEL_READ = "r";
	const PERMISSION_LEVEL_READWRITE = "rw";
	const PERMISSION_LEVEL_READWRITEDELETE = "rwd";

	private $itemIdProvider;
	private $permissions;

	public function __construct(ItemIdProvider $itemIdProvider, PermissionController $permissionController) {
		$this->itemIdProvider = $itemIdProvider;
		$this->permissions = $permissionController;

		$this->permissions->registerFilesystemPermission("filesystem_item_access", array(
			self::PERMISSION_LEVEL_NONE,
			self::PERMISSION_LEVEL_READ,
			self::PERMISSION_LEVEL_READWRITE,
			self::PERMISSION_LEVEL_READWRITEDELETE
		));
	}

	public function getItem($itemId) {
		$user = \Auth::user();
		if ($user == NULL) {
			throw new \Cloudberry\Core\NotAuthenticatedException("Cannot get item, no user folders: " . $itemId);
		}

		$id = $this->itemIdProvider->getItemId($itemId);
		if ($id == NULL) {
			throw new \Cloudberry\Core\CloudberryException("Invalid item id " . $itemId);
		}

		$rootFolder = $user->rootFolders()->where('id', '=', $id->getRootFolderId())->first();
		if ($rootFolder == NULL) {
			throw new \Cloudberry\Core\CloudberryException("Invalid item id " . $itemId . ", no user root found " . $id->getRootFolderId() . " for user " . $user->id);
		}

		// get root fs item via root folder obj
		if ($id->path == Filesystem::DIRECTORY_SEPARATOR) {
			return $rootFolder->getFsItem();
		}

		$fs = $this->createFilesystem($rootFolder);
		return $fs->createItem($id);
	}

	public function getItemByPath($root, $path) {
		$p = $path;
		if ($p == NULL) {
			$p = Filesystem::DIRECTORY_SEPARATOR;
		}

		if (substr($p, 0, 1) != Filesystem::DIRECTORY_SEPARATOR) {
			$p = Filesystem::DIRECTORY_SEPARATOR . $p;
		}

		$fs = $this->createFilesystem($root);
		$id = $this->getItemIdByPath($root, $p);
		return $fs->createItem($id);
	}

	public function getItemIdByPath($root, $path) {
		return $this->itemIdProvider->getItemIdByPath($root->id, $path);
	}

	protected function createFilesystem($root) {
		//TODO register fs types
		if ($root->type == 'local') {
			return new LocalFilesystem($root);
		}
		throw new \Cloudberry\Core\CloudberryException("Invalid root definition " . $root);
	}

	/* operations */

	public function getChildren($item) {
		if ($item->isFile()) {
			throw new Cloudberry\Core\CloudberryException("Item not a folder: " . $itemId);
		}
		//TODO assert permissions & preload child permissions
		$this->itemIdProvider->preloadChildren($item);
		return $item->getFS()->getChildren($item);
	}

	public function getFolderHierarchy($item) {
		if ($item == NULL) {
			return NULL;
		}

		//\Log::debug("hierarchy:".$item);
		$result = array();
		$current = $item->getParent();
		while ($current != NULL) {
			//\Log::debug("current:".$current);
			array_unshift($result, $current);
			$current = $current->getParent();
		}
		if (!$item->isFile()) {
			$result[] = $item;
		}
		return $result;
	}

	public function getItemDetails($item, $data = NULL) {
		$result = array();
		//TODO details providers

		if ($item->isFile()) {
			$result["size"] = $item->getSize();
		}
		$result["last_modified"] = $item->getLastModified()->toDateTimeString();

		return $result;
	}

	public function getFileSize($item) {
		$this->assertPermission($item);
		return $item->getFS()->getFileSize($item);
	}

	public function getItemLastModified($item) {
		$this->assertPermission($item);
		return $item->getFS()->getItemLastModified($item);
	}

	/* utils */

	private function assertPermission($i, $required = "r", $desc = "") {
		if (!$this->hasPermission($i, $required)) {
			new \Cloudberry\Core\CloudberryException("Insufficient permissions [" . $desc . "], required: " . $required, ErrorCodes::INSUFFICIENT_PERMISSIONS);
		}
	}

	private function hasPermission($i, $required = "r") {
		if (is_array($i)) {
			foreach ($i as $item) {
				if (!$this->permissions->hasFilesystemPermission("filesystem_item_access", $i, $required)) {
					return FALSE;
				}
			}

			return TRUE;
		}

		return $this->permissions->hasFilesystemPermission("filesystem_item_access", $i, $required);
	}
}