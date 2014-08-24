<?php

namespace Cloudberry\Filesystem;

use Illuminate\Support\Facades\Facade;

class FSC extends Facade {
	protected static function getFacadeAccessor() {
		return 'filesystemController';
	}
}

class FilesystemController {
	private $itemIdProvider;

	public function __construct(ItemIdProvider $itemIdProvider) {
		$this->itemIdProvider = $itemIdProvider;
	}

	public function getItem($itemId) {
		$user = \Auth::user();
		if ($user == NULL) {
			throw new \Cloudberry\NotAuthenticatedException("Cannot get item, no user folders: ".$itemId);
		}

		$id = $this->itemIdProvider->getItemId($itemId);
		if ($id == NULL) {
			throw new \Cloudberry\CloudberryException("Invalid item id ".$itemId);
		}

		$rootFolder = $user->rootFolders()->where('id', '=', $id->root_folder_id)->first();
		if ($rootFolder == NULL) {
			throw new \Cloudberry\CloudberryException("Invalid item id ".$itemId.", no root found ".$id->root_folder_id);
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
			$p = Filesystem::DIRECTORY_SEPARATOR.$p;
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
		throw new \Cloudberry\CloudberryException("Invalid root definition ".$root);
	}

	/* operations */

	public function getChildren($item) {
		if ($item->isFile()) {
			throw new Cloudberry\CloudberryException("Item not a folder: ".$itemId);
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
}