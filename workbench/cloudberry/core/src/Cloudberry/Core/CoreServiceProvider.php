<?php

namespace Cloudberry\Core;

use Illuminate\Support\ServiceProvider;
use \App;
use \Log;
use \Route;

class CoreServiceProvider extends ServiceProvider {

	protected $defer = false;

	public function boot() {
		$this->package('cloudberry/core');
	}

	public function register() {
		\Illuminate\Foundation\AliasLoader::getInstance()->alias('FSC', 'Cloudberry\Core\Facades\FSC');

		Route::filter('auth', function () {
			if (\Auth::guest()) {
				return \Response::make('Unauthorized', 401);
			}
		});

		/*App::fatal(function ($e) {
		Log::error($e);

		return 'TODO fatal'.$e;
		});*/

		App::error(function (CloudberryException $ce) {
			Log::error($ce);
			//return Response::make('Unauthorized', 401);
			//return array("todo" => "ce:".$ce);
			App::abort($ce->getHttpCode(), $ce->getMsg());
			//array("code" => $ce->getErrorCode(), "message" => $ce->getMsg()));
		});

		App::singleton('filesystemController', 'Cloudberry\Core\Filesystem\FilesystemController');

		App::singleton('itemIdProvider', function () {
			return new Filesystem\ItemIdProvider;
		});

		Route::group(array('prefix' => 'api/v1'), function () {
			Route::controller('session', 'Cloudberry\Core\Services\SessionServiceController');
			Route::controller('filesystem/{item_id}', 'Cloudberry\Core\Services\FilesystemServiceController');
		});
	}

	public function provides() {
		return array();
	}

}

class CloudberryException extends \Exception {
	private $httpCode;
	private $errorCode;
	private $msg;

	public function __construct($msg, $errorCode = 999, $httpCode = 400) {
		parent::__construct($msg);
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
