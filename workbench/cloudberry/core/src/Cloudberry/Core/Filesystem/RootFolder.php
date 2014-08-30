<?php

namespace Cloudberry\Core\Filesystem;

use \App;

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
		$rootItem = App::make('filesystemController')->getItemByPath($this, Filesystem::DIRECTORY_SEPARATOR);
		$rootItem->name = $this->getName();
		return $rootItem;
	}

}