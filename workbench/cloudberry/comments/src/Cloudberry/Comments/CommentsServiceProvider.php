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
				"client" => "cloudberry/comments/public/js/plugin.js",
			));

		Route::group(array('prefix' => 'comments/v1'), function () {
			Route::put('{comment_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@editComment');

			Route::get('items/{item_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@getItemComments');
			Route::post('items/{item_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@addItemComment');
			Route::delete('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@deleteItemComment');
		});
	}

	public function provides() {
		return array();
	}

}
