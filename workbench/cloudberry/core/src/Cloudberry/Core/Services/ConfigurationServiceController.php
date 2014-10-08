<?php

namespace Cloudberry\Core\Services;

use Cloudberry\Core\User;

class ConfigurationServiceController extends BaseServiceController {

	public function __construct() {
	}

	public function getUsers() {
		return User::all();
	}

	public function processUserQuery() {
		//TODO
		return User::all();
	}
}
