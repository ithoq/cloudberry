<?php

namespace Cloudberry\Filesystem;

interface Filesystem {
	public function getId();
}

interface FilesystemItem {

	function name();

	function isFile();
}

abstract class AbstractFilesystemItem implements FilesystemItem {
	private $rootFolder;
	private $name;
	private $path;

	public function name() {
		return $this->name;
	}

	public function path() {
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

	public function name() {
		return $this->attributes['name'];
	}

	public function path() {
		return $this->attributes['path'];
	}

	public function isFile() {
		return FALSE;
	}
}