<?php

namespace Cloudberry\Filesystem;

interface Filesystem {
	public function getTypeId();
}

interface FilesystemItem {

	function getName();

	function isFile();
}

abstract class AbstractFilesystemItem implements FilesystemItem {
	private $rootFolder;
	private $name;
	private $path;

	public function getName() {
		return $this->name;
	}

	public function getPath() {
		return $this->path;
	}

	abstract function isFile();
}

class File extends AbstractFilesystemItem {
	public function isFile() {
		return TRUE;
	}
}

class Folder extends AbstractFilesystemItem {
	public function isFile() {
		return FALSE;
	}
}

class RootFolder extends \Eloquent implements FilesystemItem {
	protected $table = 'folders';

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

	public function isFile() {
		return FALSE;
	}
}