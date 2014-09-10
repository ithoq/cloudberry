<?php

namespace Cloudberry\Comments\Services;

use \Auth;
use \Cloudberry\Comments\Comment;
use \Input;

class CommentsServiceController extends \Cloudberry\Core\Services\BaseServiceController {

	public function getIndex($itemId) {
		$item = $this->_getItem($itemId);
		return Comment::forItem($itemId);
	}

	public function postIndex($itemId) {
		if (!Input::has("comment")) {
			$this->invalidRequestJsonResponse("Missing comment");
		}
		$item = $this->_getItem($itemId);

		$comment = Comment::create(array(
				'comment' => Input::get("comment"),
				'user_id' => Auth::user()->id
			));
		$comment->item()->save($item->getItemId());
	}
}