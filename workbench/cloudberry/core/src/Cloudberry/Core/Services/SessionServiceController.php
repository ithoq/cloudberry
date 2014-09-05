<?php

namespace Cloudberry\Core\Services;

use Cloudberry\Core\Facades\Cloudberry;
use Cloudberry\Core\User;
use \Auth;
use \Input;
use \Log;

class SessionServiceController extends BaseServiceController {

	public function getInfo() {
		// not logged
		if (!Auth::check()) {
			return array();
		}

		$user = Auth::user();

		$folders = array();
		foreach ($user->rootFolders()->get() as $rf) {
			$folders[] = $rf->getFsItem();
		}
		//Log::debug($folders);

		return array(
			'id' => \Session::getId(),
			'plugins' => Cloudberry::getPlugins(),
			'user' => $user,
			'folders' => $folders,
			'permissions' => array(), //TODO
			'data' => array(
				'permission_types' => array()//TODO
			)
		);
	}

	public function postLogin() {
		//TODO filter
		if (!Input::has("name") and !Input::has("password")) {
			$this->invalidRequestJsonResponse("Missing name and/or password");
		}

		//TODO get user based on name or email, and attempt with that
		$auth = array(
			'name' => Input::get("name"),
			'password' => Input::get("password")
		);

		Log::debug('Logging with ' . $auth["name"] . '/' . $auth["password"]);

		if (!Auth::attempt($auth)) {
			throw new \Cloudberry\Core\CloudberryException("Authentication failed", \Cloudberry\Core\ErrorCodes::AUTHENTICATION_FAILED);
		}

		return $this->getInfo();
	}

	public function anyLogout() {
		Auth::logout();
		return array();
	}
}