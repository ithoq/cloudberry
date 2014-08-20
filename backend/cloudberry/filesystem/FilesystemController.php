<?php

namespace Cloudberry\Filesystem;

use Illuminate\Support\Facades\Facade;
use \Log;

class FSC extends Facade {
	protected static function getFacadeAccessor() {
		return 'filesystemController';
	}
}

class FilesystemController {
	public function getItem($itemId) {
		$id = ItemId::find($itemId);//TODO cache
		if ($id == NULL) {
			throw new Cloudberry\CloudberryException("Invalid item id ".$itemId);
		}

		$rootFolder = RootFolder::find($id->root_folder_id);
		if ($rootFolder == NULL) {
			throw new Cloudberry\CloudberryException("Invalid item id ".$itemId.", no root found ".$id->root_folder_id);
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

class FilesystemServiceController extends \BaseController {

	public function getIndex($itemId) {
		$folders = array();
		if ($itemId == 'roots') {
			$user = \Auth::user();

			foreach ($user->rootFolders()->get() as $rf) {
				$folders[] = $rf->getFsItem();
			}
		}
		return $folders;
	}

	public function getRoots() {
		//?
		return array("roots" => TRUE);
	}

	public function getChildren($itemId) {

		//TODO download etc
		Log::debug('Index for '.$itemId);
		$folder = $this->getFolder($itemId);
		return $folder->getChildren();
	}

	public function postInfo($itemId) {
		$children = ($itemId == 'roots')?$this->getIndex($itemId):$this->getChildren($itemId);
		//TODO permissions, hierarchy
		return array("folder" => NULL, "children" => $children);
	}

	protected function getItem($itemId) {
		$item = FSC::getItem($itemId);
		if ($item == NULL) {
			throw new \Cloudberry\CloudberryException("Invalid item id: ".$itemId);
		}

		return $item;
	}

	protected function getFolder($itemId) {
		$item = FSC::getItem($itemId);
		if ($item->isFile()) {
			throw new \Cloudberry\CloudberryException("Item not a folder: ".$itemId);
		}
		return $item;
	}

	protected function getFile($itemId) {
		$item = FSC::getItem($itemId);
		if (!$item->isFile()) {
			throw new \Cloudberry\CloudberryException("Item not a file: ".$itemId);
		}
		return $item;
	}
}

class RootFolder extends \Eloquent {
	protected $table = 'root_folders';

	protected $hidden = array('pivot');

	public function getNameAttribute() {
		if ($this->pivot->attributes['name'] != NULL) {
			return $this->pivot->attributes['name'];
		}

		return $this->attributes['name'];
	}

	public function getName() {
		return $this->getNameAttribute();
	}

	public function getPath() {
		return $this->attributes['path'];
	}

	public function getType() {
		return $this->attributes['type'];
	}

	public function getFsItem() {
		$rootItem = FSC::getItemByPath($this, Filesystem::DIRECTORY_SEPARATOR);
		$rootItem->name = $this->getName();
		return $rootItem;
	}

}

class ItemId extends \Eloquent {
	protected $table = 'item_ids';
	protected $fillable = array('root_folder_id', 'path');

	public $incrementing = false;

	protected static function boot() {
		parent::boot();

		static ::creating(function ($itemId) {
			$itemId->{ $itemId->getKeyName()} = uniqid("");//create unique id (UUID?)
		});
	}
}