<?php

namespace Cloudberry\Filesystem;

class FilesystemServiceController extends \BaseController {

	public function getIndex($itemId) {
		$folders = array();
		if ($itemId == 'roots') {
			$user = \Auth::user();

			foreach ($user->rootFolders()->get() as $rf) {
				$folders[] = $rf->getFsItem();
			}
		}
		return $folders;
	}

	public function getChildren($itemId) {
		$folder = $this->getFolder($itemId);
		return $folder->getChildren();
	}

	public function anyInfo($itemId) {
		$children = ($itemId == 'roots')?$this->getIndex($itemId):$this->getChildren($itemId);
		//TODO permissions, hierarchy
		return array("folder" => NULL, "children" => $children);
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
}