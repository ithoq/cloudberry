<?php

namespace Cloudberry;

use Illuminate\Support\ServiceProvider;
use \App;
use \Auth;
use \Input;
use \Log;
use \Route;

class CoreServiceProvider extends ServiceProvider {

	public function register() {
		App::bind('filesystemController', function () {
			return new Filesystem\FilesystemController;
		});

		Route::group(array('prefix' => 'api/v1'), function () {
			Route::controller('session', 'Cloudberry\SessionController');
			Route::controller('filesystem/{item_id}', 'Cloudberry\Filesystem\FilesystemServiceController');
		});
	}

}

class SessionController extends \BaseController {

	public function getInfo() {
		if (Auth::check()) {
			$user = Auth::user();
			return array(
				'id'          => \Session::getId(),
				'user'        => $user,
				'folders'     => $user->folders()->get(),
				'permissions' => array(), //TODO
				'data' => array(
					'permission_types' => array()//TODO
				)
			);
		}

		// not logged
		return array();
	}

	public function postLogin() {
		//TODO filter
		if (!Input::has("name") and !Input::has("password")) {
			$this->invalidRequestJsonResponse("Missing name and/or password");
		}

		//TODO get user based on name or email, and attempt with that
		$auth = array(
			'name'     => Input::get("name"),
			'password' => Input::get("password")
		);

		Log::debug('Logging with '.$auth["name"].'/'.$auth["password"]);

		if (!Auth::attempt($auth)) {
			return $this->unauthorizedJsonResponse();
		}

		return array();
	}

	public function anyLogout() {
		Auth.logout();
		return array();
	}
}