<?php

namespace Cloudberry\Filesystem;

use Illuminate\Support\Facades\Facade;
use \Log;

class FS extends Facade {
	protected static function getFacadeAccessor() {
		return 'filesystemController';
	}
}

class FilesystemController {
	public function getItem($itemId) {
		return NULL;
	}

	public function getItemByPath($root, $path) {
		$fs = $this->createFilesystem($root);

		$id = ItemId::firstOrCreate(array('root_folder_id' => $root->id, "path" => $path));//TODO cache
		Log::debug("getItemByPath ROOT=".$root." FS=".$fs." ID=".$id);
		return $fs->createItem($root, $id);
	}

	public function createFilesystem($root) {
		if ($root->type == 'local') {
			return new LocalFilesystem($root);
		}

		return NULL;
	}
}

class FilesystemServiceController extends \BaseController {

	public function getIndex($itemId) {
		Log::debug('Index for '.$itemId);
		$item = $this->getItem($itemId);
		return array();
	}

	public function getInfo($itemId) {
		Log::debug('Info for '.$itemId);
		return array();
	}

	protected function getItem($itemId) {
		$item = FS::getItem($itemId);
	}
}

class RootFolder extends \Eloquent {
	protected $table = 'root_folders';

	//protected $hidden = array('pivot');

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
		$rootItem       = FS::getItemByPath($this, "/", $this->getName());
		$rootItem->name = $this->getName();
		return $rootItem;
	}

}

class ItemId extends \Eloquent {
	protected $table    = 'item_ids';
	protected $fillable = array('root_folder_id', 'path');

	public $incrementing = false;

	protected static function boot() {
		parent::boot();

		static ::creating(function ($itemId) {
			$itemId->{ $itemId->getKeyName()} = (string) ItemId::UUID();
		});
	}

	public static function UUID() {
		/*if (function_exists('com_create_guid') === true) {
		return trim(com_create_guid(), '{}');
		}*/
		return uniqid("");
	}
}