<?php

namespace Cloudberry\Filesystem;

interface Filesystem {
	public function getId();

	public function createItem($rootFolder, $itemId);
}

interface FilesystemItem {

	function getId();

	function getName();

	function getPath();

	function isFile();
}

abstract class AbstractFilesystemItem extends \Eloquent implements FilesystemItem {
	private $rootFolder;
	private $name;
	private $path;

	public function __construct($id, $rootFolder, $path, $name) {
		$this->id          = $id;
		$this->$rootFolder = $rootFolder;
		$this->name        = $name;
		$this->path        = $path;
		$this->attributes  = array("id" => $id, "name" => $name, "path" => $path);
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

class LocalFilesystem implements Filesystem {
	private $rootFolder;

	public function __construct($rootFolder) {
		$this->rootFolder = $rootFolder;
	}

	public function getId() {
		return "local";
	}

	public function createItem($rootFolder, $itemId) {
		//$internalPath = $this->joinInternalPath($rootFolder->getPath(), $itemId->path);
		$name = "TODO extract from path";

		return new File($itemId->id, $rootFolder, $itemId->path, $name);
	}

	private function joinInternalPath($p1, $p2) {
		return $p1.$p2;//TODO
	}

	public function __toString() {
		return "Local filesystem (".$this->rootFolder.")";
	}
}