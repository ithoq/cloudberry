<?php

namespace Cloudberry\Filesystem;

interface Filesystem {
	const DIRECTORY_SEPARATOR = "/";

	public function getId();

	public function createItem($itemId);

	public function getChildren($folder);
}

interface FilesystemItem {

	function getId();

	function getName();

	function getPath();

	function isFile();
}

interface FilesystemFile extends FilesystemItem {

}

interface FilesystemFolder extends FilesystemItem {

	function isRoot();

	function getChildren();

}

abstract class AbstractFilesystemItem extends \Eloquent implements FilesystemItem {
	protected $hidden = array('fs');

	public function __construct($fs, $id, $path, $name) {
		$this->attributes = array("id" => $id, "name" => $name, "path" => $path, "fs" => $fs, "is_file" => $this->isFile());
	}

	public function getFS() {
		return $this->fs;
	}

	public function getId() {
		return $this->id;
	}

	public function getName() {
		return $this->name;
	}

	public function getPath() {
		return $this->path;
	}

	abstract function isFile();
}

class File extends AbstractFilesystemItem implements FilesystemFile {
	public function isFile() {
		return TRUE;
	}
}

class Folder extends AbstractFilesystemItem implements FilesystemFolder {
	public function __construct($fs, $id, $path, $name) {
		parent::__construct($fs, $id, $path, $name);
		$this->attributes["is_root"] = $this->isRoot();
	}

	public function isRoot() {
		return $this->path == Filesystem::DIRECTORY_SEPARATOR;
	}

	public function getChildren() {
		return FSC::getChildren($this);
	}

	public function isFile() {
		return FALSE;
	}
}