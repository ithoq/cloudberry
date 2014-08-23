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

		$rootFolder = $user->rootFolders()->find($id->root_folder_id);
		if ($rootFolder == NULL) {
			throw new \Cloudberry\CloudberryException("Invalid item id ".$itemId.", no root found ".$id->root_folder_id);
		}
		$fs = $this->createFilesystem($rootFolder);
		return $fs->createItem($id);
	}

	public function getItemByPath($root, $path) {
		$fs = $this->createFilesystem($root);
		$id = $this->itemIdProvider->getItemIdByPath($root->id, $path);
		return $fs->createItem($id);
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

	public function parent($item) {
		if (!$item->isFile() and $item->isRoot()) return NULL;
		
		//$parentPath = self::folderPath(dirname($item->internalPath()));
		//return $this->itemWithPath($this->publicPath($parentPath));
	}
}