<?php

namespace Cloudberry\Core\Facades;

use Illuminate\Support\Facades\Facade;

class FSC extends Facade {
	protected static function getFacadeAccessor() {
		return 'filesystemController';
	}
}