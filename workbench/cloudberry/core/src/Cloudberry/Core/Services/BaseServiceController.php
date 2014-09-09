<?php

namespace Cloudberry\Core\Services;

use \FSC;

class BaseServiceController extends \Controller {
	/* utils */

	protected function _getItem($itemId) {
		$item = FSC::getItem($itemId);
		if ($item == NULL) {
			throw new \Cloudberry\Core\CloudberryException("Invalid item id: " . $itemId);
		}

		return $item;
	}

	protected function _getFolder($itemId) {
		$item = FSC::getItem($itemId);
		if ($item->isFile()) {
			throw new \Cloudberry\Core\CloudberryException("Item not a folder: " . $itemId);
		}
		return $item;
	}

	protected function _getFile($itemId) {
		$item = FSC::getItem($itemId);
		if (!$item->isFile()) {
			throw new \Cloudberry\Core\CloudberryException("Item not a file: " . $itemId);
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
