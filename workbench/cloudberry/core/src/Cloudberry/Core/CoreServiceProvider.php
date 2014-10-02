<?php

namespace Cloudberry\Core;

use Illuminate\Support\ServiceProvider;
use \App;
use \Event;
use \Log;
use \Route;

class CoreServiceProvider extends ServiceProvider {

	protected $defer = false;

	public function boot() {
		$this->package('cloudberry/core');
	}

	public function register() {
		Event::listen("illuminate.query", function ($query, $bindings, $time, $name) {
			\Log::debug($query . "\n");
			\Log::debug(json_encode($bindings) . "\n");
		});

		\Illuminate\Foundation\AliasLoader::getInstance()->alias('FSC', 'Cloudberry\Core\Facades\FSC');

		Route::filter('auth', function () {
			if (\Auth::guest()) {
				return \Response::make('Unauthorized', 401);
			}
		});

		/*App::fatal(function ($e) {
		Log::error($e);

		return \Response::json([
		'error' => 999,
		'message' => 'Unexpected application error: ' . $e],
		500
		);
		});*/

		App::error(function (CloudberryException $ce) {
			Log::error($ce);

			return \Response::json([
				'error' => $ce->getErrorCode(),
				'message' => $ce->getMsg()],
				$ce->getHttpCode()
			);
		});

		App::singleton('cloudberry', 'Cloudberry\Core\CloudberryController');

		App::singleton('filesystemController', 'Cloudberry\Core\Filesystem\FilesystemController');

		App::singleton('permissionController', 'Cloudberry\Core\Permissions\PermissionController');

		App::singleton('itemIdProvider', function () {
			return new Filesystem\ItemIdProvider;
		});

		Route::group(array('prefix' => 'api/v1'), function () {
			Route::controller('session', 'Cloudberry\Core\Services\SessionServiceController');
			Route::controller('filesystem/{item_id}', 'Cloudberry\Core\Services\FilesystemServiceController');

			Route::group(array('prefix' => 'permissions'), function () {
				Route::get('types', 'Cloudberry\Core\Services\PermissionServiceController@getPermissionTypes');
				//Route::post('items/{item_id}', 'Cloudberry\Comments\Services\CommentsServiceController@addItemComment');
				//Route::delete('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\CommentsServiceController@deleteItemComment');
			});
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

	public function __construct($msg, $errorCode = ErrorCodes::UNKNOWN, $httpCode = 400) {
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

class ErrorCodes {

	const REQUEST_FAILED = 1;

	const AUTHENTICATION_FAILED = 101;
	const INSUFFICIENT_PERMISSIONS = 102;

	const UNKNOWN = 999;
}
