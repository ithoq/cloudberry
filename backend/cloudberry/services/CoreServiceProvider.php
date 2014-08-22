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
		/*App::fatal(function ($e) {
		Log::error($e);

		return 'TODO fatal'.$e;
		});*/

		App::error(function (CloudberryException $ce) {
			Log::error($ce);
			//return Response::make('Unauthorized', 401);
			//return array("todo" => "ce:".$ce);
			App::abort($ce->getHttpCode(), array("code" => $ce->getErrorCode(), "message" => $ce->getMsg()));
		});

		App::bind('filesystemController', function () {
			return new Filesystem\FilesystemController;
		});

		Route::group(array('prefix' => 'api/v1'), function () {
			Route::controller('session', 'Cloudberry\SessionServiceController');
			Route::controller('filesystem/{item_id}', 'Cloudberry\FilesystemServiceController');
		});
	}

}

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

		Log::debug('Logging with '.$auth["name"].'/'.$auth["password"]);

		if (!Auth::attempt($auth)) {
			throw new CloudberryException("Authentication failed", 1);//TODO error codes
		}

		return array();
	}

	public function anyLogout() {
		Auth.logout();
		return array();
	}
}

class CloudberryException extends \Exception {
	private $httpCode;
	private $errorCode;
	private $msg;

	public function __construct($msg, $errorCode = 999, $httpCode = 400) {
		$this->errorCode = $errorCode;
		$this->httpCode = $httpCode;
		$this->msg = $msg;
	}

	public function getHttpCode() {
		return $this->httpCode;
	}

	public function getErrorCode() {
		return $this->errorCode;
	}

	public function getMsg() {
		return $this->msg;
	}
}

class NotAuthenticatedException extends CloudberryException {
	public function __construct($msg) {
		parent::__construct($msg, NULL, 401);
	}
}