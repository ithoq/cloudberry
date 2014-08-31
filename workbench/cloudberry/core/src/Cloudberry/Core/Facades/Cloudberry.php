<?php

namespace Cloudberry\Core\Facades;

use Illuminate\Support\Facades\Facade;

class Cloudberry extends Facade {
	protected static function getFacadeAccessor() {
		return 'cloudberry';
	}
}