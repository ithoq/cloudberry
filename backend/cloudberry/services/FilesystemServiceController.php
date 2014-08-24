<?php

namespace Cloudberry;

use \Cloudberry\Filesystem\FSC;

class FilesystemServiceController extends BaseServiceController {

	public function __construct() {
		$this->beforeFilter('auth');
	}

	public function getIndex($itemId) {
		if (\Request::isAjax()) {
			if ($itemId == 'roots') {
				return $this->_getRoots();
			} else {
				$item = $this->_getItem($itemId);
				if (!$item->isFile()) {
					return $item->getChildren();
				} else {
					return $item;
				}
			}
		} else {
			//TODO download if file, folder??
		}
	}

	public function getChildren($itemId) {
		$folder = $this->_getFolder($itemId);
		return $folder->getChildren();
	}

	public function getHierarchy($itemId) {
		$item = $this->_getItem($itemId);
		return FSC::getFolderHierarchy($item);
	}

	public function anyInfo($itemId) {
		$data = \Input::json();
		$item = ($itemId == 'roots')?NULL:$this->_getItem($itemId);

		$result = array(
			"item" => $item,
		);
		if ($data->get("children")) {
			$children = NULL;
			if ($itemId == 'roots') {
				$children = $this->_getRoots();
			} else if (!$item->isFile()) {
				$children = $item->getChildren();
			}

			$result["children"] = $children;
		}
		if ($data->get("hierarchy")) {
			$result["hierarchy"] = FSC::getFolderHierarchy($item);
		}

		//TODO permissions

		return $result;
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