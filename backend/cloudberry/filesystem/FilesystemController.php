<?php

namespace Cloudberry\Filesystem;

use Illuminate\Support\Facades\Facade;
use \Log;

class FS extends Facade {

	protected static function getFacadeAccessor() {return 'filesystemController';}

}

class FilesystemController {
	public function getItem($itemId) {
		return NULL;
	}
}

class FilesystemServiceController extends \BaseController {

	public function getIndex($itemId) {
		Log::debug('Index for '.$itemId);
		$item = $this->getItem($itemId);
		return array();
	}

	public function getInfo($itemId) {
		Log::debug('Info for '.$itemId);
		return array();
	}

	protected function getItem($itemId) {
		$item = FS::getItem($itemId);
	}
}