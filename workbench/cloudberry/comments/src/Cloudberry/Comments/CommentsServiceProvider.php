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
		Cloudberry::registerPlugin("cloudberry/comments", array(
			"init" => function ($r) {
				\Log::debug("Comments init");
			},
			"client" => "cloudberry/comments/public/js/plugin.js",
		));

		Route::group(array('prefix' => 'comments/v1'), function () {
			Route::put('{comment_id}', 'Cloudberry\Comments\Services\CommentsServiceController@editComment');

			Route::get('items/{item_id}', 'Cloudberry\Comments\Services\CommentsServiceController@getItemComments');
			Route::post('items/{item_id}', 'Cloudberry\Comments\Services\CommentsServiceController@addItemComment');
			Route::delete('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\CommentsServiceController@deleteItemComment');
		});
	}

	public function provides() {
		return array();
	}

}
