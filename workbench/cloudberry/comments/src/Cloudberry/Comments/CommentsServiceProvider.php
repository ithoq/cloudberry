<?php namespace Cloudberry\Comments;

use Cloudberry\Core\Facades\Cloudberry;
use Illuminate\Support\ServiceProvider;
use \Route;

class CommentsServiceProvider extends ServiceProvider {

	protected $defer = false;

	public function boot() {
		$this->package('cloudberry/comments');
	}

	public function register() {
		Cloudberry::registerPlugin("comments");

		Route::group(array('prefix' => 'comments/v1'), function () {
			Route::controller('items/{item_id}', 'Cloudberry\Comments\Services\CommentsServiceController');
		});
	}

	public function provides() {
		return array();
	}

}
