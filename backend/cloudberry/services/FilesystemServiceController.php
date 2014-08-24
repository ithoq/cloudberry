<?php

namespace Cloudberry;

use \Cloudberry\Filesystem\FSC;

class FilesystemServiceController extends BaseServiceController {

	public function __construct() {
		$this->beforeFilter('auth');
	}

	public function getIndex($itemId) {
		if ($itemId == 'roots') {
			return $this->_getRoots();
		}
		return array();
	}

	public function getChildren($itemId) {
		$folder = $this->_getFolder($itemId);
		return $folder->getChildren();
	}

	public function anyFolderInfo($itemId) {
		$folder = ($itemId == 'roots')?NULL:$this->_getFolder($itemId);

		$result = array(
			"folder" => $folder,
			"children" => ($itemId == 'roots')?$this->_getRoots():$folder->getChildren()
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

	/* utils */

	protected function _getItem($itemId) {
		$item = FSC::getItem($itemId);
		if ($item == NULL) {
			throw new \Cloudberry\CloudberryException("Invalid item id: ".$itemId);
		}

		return $item;
	}

	protected function _getFolder($itemId) {
		$item = FSC::getItem($itemId);
		if ($item->isFile()) {
			throw new \Cloudberry\CloudberryException("Item not a folder: ".$itemId);
		}
		return $item;
	}

	protected function _getFile($itemId) {
		$item = FSC::getItem($itemId);
		if (!$item->isFile()) {
			throw new \Cloudberry\CloudberryException("Item not a file: ".$itemId);
		}
		return $item;
	}

	protected function _getRoots() {
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