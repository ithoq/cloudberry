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
			//Route::controller('items/{item_id}', 'Cloudberry\Comments\Services\ItemCommentsListServiceController');
			//Route::controller('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController');
			Route::get('items/{item_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@getIndex');
			Route::post('items/{item_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@postIndex');
			Route::delete('items/{item_id}/{comment_id}', 'Cloudberry\Comments\Services\ItemCommentsServiceController@deleteIndex');
		});
	}

	public function provides() {
		return array();
	}

}
