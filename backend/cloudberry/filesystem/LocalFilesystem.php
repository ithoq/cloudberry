<?php

namespace Cloudberry\Filesystem;

class LocalFilesystem implements Filesystem {
	private $rootFolder;

	public function __construct($rootFolder) {
		$this->rootFolder = $rootFolder;
	}

	public function getId() {
		return "local";
	}

	public function createItem($itemId) {
		if ($itemId->root_folder_id !== $this->rootFolder->id) {
			throw new \Cloudberry\CloudberryException("Create item: Root does not match: ".$itemId->root_folder_id."/".$this->rootFolder->id);
		}

		$internalPath = $itemId->path;
		$name = self::basename($internalPath);
		$isRoot = ($internalPath == Filesystem::DIRECTORY_SEPARATOR);
		$nativePath = $this->_getNativePath($internalPath);

		$rootId = $isRoot?$itemId:FSC::getItemIdByPath($this->rootFolder, Filesystem::DIRECTORY_SEPARATOR);
		$parentId = $isRoot?NULL:FSC::getItemIdByPath($this->rootFolder, $this->_getInternalPath(dirname($nativePath)));

		if ($this->_isFolderPath($itemId->path)) {
			return new Folder($this, $itemId->id, ($parentId != NULL?$parentId->id:NULL), $rootId->id, $internalPath, $name);
		} else {
			return new File($this, $itemId->id, ($parentId != NULL?$parentId->id:NULL), $rootId->id, $internalPath, $name);
		}
	}

	/* operations */

	public function getChildren($folder) {
		$this->assertFolder($folder);

		$parentNativePath = $this->_getNativePath($folder->path);
		$items = scandir($parentNativePath);
		if (!$items) {
			throw new \Cloudberry\CloudberryException("Invalid folder: ".$folder);
		}

		$rootId = $id = FSC::getItemIdByPath($this->rootFolder, Filesystem::DIRECTORY_SEPARATOR);

		$result = array();
		foreach ($items as $i => $name) {
			if ($name == "." or $name == ".." or (strcmp(substr($name, 0, 1), '.') == 0)) {
				continue;
			}

			$nativePath = self::joinPath($parentNativePath, $name, FALSE);
			$isFolder = is_dir($nativePath);

			$internalPath = $this->_getInternalPath($nativePath);
			if ($isFolder) {
				$internalPath = self::folderPath($internalPath);
			}

			$id = FSC::getItemIdByPath($this->rootFolder, $internalPath);

			if (!$isFolder) {
				$result[] = new File($this, $id->id, $folder->id, $rootId->id, $internalPath, $name);
			} else {
				$result[] = new Folder($this, $id->id, $folder->id, $rootId->id, $internalPath, $name);
			}
		}

		return $result;
	}

	/* tools */

	private function assertFile($item) {
		$this->assertFS($item);
		if (!$item->isFile()) {
			throw new Cloudberry\CloudberryException("Not a file: ".$item);
		}
	}

	private function assertFolder($item) {
		$this->assertFS($item);
		if ($item->isFile()) {
			throw new Cloudberry\CloudberryException("Not a folder: ".$item);
		}
	}

	private function assertFS($item) {
		if ($item->fs !== $this) {
			throw new Cloudberry\CloudberryException("FS does not match: ".$item."/".$this);
		}
	}

	private function _getNativePath($internalPath) {
		str_replace(DIRECTORY_SEPARATOR, Filesystem::DIRECTORY_SEPARATOR, $internalPath);
		return self::joinPath($this->rootFolder->path, $internalPath, FALSE);
	}

	private function _getInternalPath($nativeFullPath) {
		$p = substr($nativeFullPath, strlen($this->rootFolder->path));
		str_replace(Filesystem::DIRECTORY_SEPARATOR, DIRECTORY_SEPARATOR, $p);
		return $p;
	}

	private function _isFolderPath($path, $internal = TRUE) {
		$n = trim($path);
		return (substr($n, -1) == ($internal?Filesystem::DIRECTORY_SEPARATOR:DIRECTORY_SEPARATOR));
	}

	public static function folderPath($path, $internal = TRUE) {
		$sp = $internal?Filesystem::DIRECTORY_SEPARATOR:DIRECTORY_SEPARATOR;
		return rtrim($path, $sp).$sp;
	}

	public static function joinPath($p1, $p2, $internal = TRUE) {
		$sp = $internal?Filesystem::DIRECTORY_SEPARATOR:DIRECTORY_SEPARATOR;
		return rtrim($p1, $sp).$sp.$p2;
	}

	public static function basename($path, $internal = TRUE) {
		if ($internal) {
			$name = strrchr(rtrim($path, Filesystem::DIRECTORY_SEPARATOR), Filesystem::DIRECTORY_SEPARATOR);
		} else {

			$name = strrchr(rtrim($path, DIRECTORY_SEPARATOR), DIRECTORY_SEPARATOR);
		}

		if (!$name) {
			return "";
		}

		return substr($name, 1);
	}

	public function __toString() {
		return "Local filesystem (".$this->rootFolder.")";
	}
}