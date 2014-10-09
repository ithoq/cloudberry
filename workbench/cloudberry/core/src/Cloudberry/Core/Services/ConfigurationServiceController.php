<?php

namespace Cloudberry\Core\Services;

use Cloudberry\Core\User;
use \Hash;
use \Input;

class ConfigurationServiceController extends BaseServiceController {

	public function __construct() {
	}

	public function getUsers() {
		return User::all();
	}

	public function getUser($id) {
		return User::find($id);
	}

	public function getUserFolders($id) {
		return User::find($id)->rootFolders()->get();
	}

	public function getUserGroups($id) {
		return [];//TODO
	}

	public function addUser() {
		if (!Input::has("name") or !Input::has("email") or !Input::has("password")) {
			throw new \Cloudberry\Core\CloudberryException("Missing user properties");
		}
		//TODO validate
		$name = Input::has("name") ? Input::get("name") : NULL;
		$subject = Input::has("subject") ? Input::get("subject") : NULL;
		$userId = Input::has("user_id") ? Input::get("user_id") : NULL;

		$user = User::create(array(
			'name' => Input::get("name"),
			'email' => Input::get("email"),
			'password' => Hash::make(Input::get("password")),
			'is_group' => FALSE,
			'type' => '',
		));
		return $user;
	}

	public function processUserQuery() {
		//TODO
		return User::all();
	}
}
