<?php

namespace Cloudberry\Filesystem;

use Illuminate\Support\Facades\Facade;

class FSC extends Facade {
	protected static function getFacadeAccessor() {
		return 'filesystemController';
	}
}

class FilesystemController {
	public function getItem($itemId) {
		$user = \Auth::user();
		if ($user == NULL) {
			throw new \Cloudberry\NotAuthenticatedException("Cannot get item, no user folders: ".$itemId);
		}

		$id = ItemId::find($itemId);//TODO cache
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
		$id = ItemId::firstOrCreate(array('root_folder_id' => $root->id, "path" => $path));//TODO cache
		//Log::debug("getItemByPath ROOT=".$root." FS=".$fs." ID=".$id);
		return $fs->createItem($id);
	}

	protected function createFilesystem($root) {
		//TODO register fs types
		if ($root->type == 'local') {
			return new LocalFilesystem($root);
		}

		return NULL;
	}

	/* operations */

	public function getChildren($item) {
		if ($item->isFile()) {
			throw new Cloudberry\CloudberryException("Item not a folder: ".$itemId);
		}
		//TODO assert permissions & preload child permissions
		return $item->getFS()->getChildren($item);
	}
}