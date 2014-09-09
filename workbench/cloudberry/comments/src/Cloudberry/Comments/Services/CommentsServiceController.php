<?php

namespace Cloudberry\Comments\Services;

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

		$comment = Comments::create(array(
				'comment' => Input::get("comment"),
			));
		$comment->item()->save($comment);
	}
}