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

		App::singleton('Cloudberry\Core\Permissions\PermissionController');

		App::singleton('filesystemController', 'Cloudberry\Core\Filesystem\FilesystemController');

		App::singleton('cloudberry', 'Cloudberry\Core\CloudberryController');

		App::singleton('Cloudberry\Core\Filesystem\ItemIdProvider');

		Route::group(array('prefix' => 'api/v1'), function () {
			Route::controller('session', 'Cloudberry\Core\Services\SessionServiceController');
			Route::controller('filesystem/{item_id}', 'Cloudberry\Core\Services\FilesystemServiceController');

			Route::group(array('prefix' => 'configuration'), function () {
				Route::get('users', 'Cloudberry\Core\Services\ConfigurationServiceController@getUsers');
				Route::post('users', 'Cloudberry\Core\Services\ConfigurationServiceController@addUser');
				Route::get('users/{user_id}', 'Cloudberry\Core\Services\ConfigurationServiceController@getUser');
				Route::get('users/{user_id}/folders', 'Cloudberry\Core\Services\ConfigurationServiceController@getUserFolders');
				Route::get('users/{user_id}/groups', 'Cloudberry\Core\Services\ConfigurationServiceController@getUserGroups');
				Route::post('users/query', 'Cloudberry\Core\Services\ConfigurationServiceController@processUserQuery');
			});

			Route::group(array('prefix' => 'permissions'), function () {
				Route::get('types', 'Cloudberry\Core\Services\PermissionServiceController@getPermissionTypes');
				Route::get('list', 'Cloudberry\Core\Services\PermissionServiceController@getPermissionList');
				Route::get('list/generic', 'Cloudberry\Core\Services\PermissionServiceController@getGenericPermissionList');
				Route::get('user/{user_id}', 'Cloudberry\Core\Services\PermissionServiceController@getUserPermissions');
				Route::get('user/{user_id}/generic', 'Cloudberry\Core\Services\PermissionServiceController@getGenericUserPermissions');
				//Route::post('items/{item_id}', 'Cloudberry\Comments\Services\CommentsServiceController@addItemComment');
				//Route::delete('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\CommentsServiceController@deleteItemComment');
			});
		});

		App::before(function ($request) {
			\Log::debug("Cloudberry START: " . $request);
			$cloudberry = App::make('cloudberry');
			$cloudberry->init($request);
		});

		App::after(function ($request, $response) {
			\Log::debug("Cloudberry END: " . $response);
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
