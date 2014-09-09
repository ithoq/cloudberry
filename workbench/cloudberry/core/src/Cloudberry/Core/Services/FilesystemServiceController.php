<?php

namespace Cloudberry\Core\Services;

use \FSC;

class FilesystemServiceController extends BaseServiceController {

	public function __construct() {
		$this->beforeFilter('auth');
	}

	public function getIndex($itemId) {
		if (\Request::ajax()) {
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
		$item = ($itemId == 'roots') ? NULL : $this->_getItem($itemId);

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
		if ($data->get("permissions")) {
			//TODO permissions
		}
		if ($data->get("details")) {
			$result["details"] = FSC::getItemDetails($item, $data->get("data"));
		}

		return $result;
	}
}