<?php

namespace Cloudberry;

use \Cloudberry\Filesystem\FSC;

class FilesystemServiceController extends BaseServiceController {

	public function __construct() {
		$this->beforeFilter('auth');
	}

	public function getIndex($itemId) {
		if ($itemId == 'roots') {
			return $this->getRoots();
		}
		return array();
	}

	public function getChildren($itemId) {
		$folder = $this->getFolder($itemId);
		return $folder->getChildren();
	}

	public function anyFolderInfo($itemId) {
		$folder = ($itemId == 'roots')?NULL:$this->getFolder($itemId);

		$result = array(
			"folder" => $folder,
			"children" => ($itemId == 'roots')?$this->getRoots():$folder->getChildren()
		);
		if (\Input::json()->get("hierarchy")) {
			$result["hierarchy"] = FSC::getFolderHierarchy($folder);
		}

		//TODO permissions

		return $result;
	}

	public function getDetails($itemId) {
		$folder = $this->getItem($itemId);
		return array();
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

	protected function getRoots() {
		$roots = array();
		$user = \Auth::user();

		if ($user != NULL) {
			foreach ($user->rootFolders()->get() as $rf) {
				$roots[] = $rf->getFsItem();
			}
		}
		return $roots;
	}
}