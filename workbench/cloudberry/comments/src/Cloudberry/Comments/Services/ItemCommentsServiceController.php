<?php

namespace Cloudberry\Comments\Services;

use \Cloudberry\Comments\Comment;

class ItemCommentsServiceController extends \Cloudberry\Core\Services\BaseServiceController {

	public function getItemComments($itemId) {
		$item = $this->_getItem($itemId);
		return Comment::forItem($itemId);
	}

	public function addItemComment($itemId) {
		if (!\Input::has("comment")) {
			$this->invalidRequestJsonResponse("Missing comment");
		}
		$item = $this->_getItem($itemId);

		$comment = Comment::create(array(
				'comment' => \Input::get("comment"),
				'user_id' => \Auth::user()->id
			));
		$comment->item()->save($item->getItemId());
		return array();
	}

	public function editComment($commentId) {
		if (!\Input::has("comment")) {
			$this->invalidRequestJsonResponse("Missing comment");
		}
		//TODO permissions
		//TODO own comment/admin
		$comment = Comment::find($commentId);
		//TODO validate comment from right item? find via comment->item?
		if ($comment != NULL) {
			$comment->comment = \Input::get("comment");
			$comment->save();
		}
		return array();
	}

	public function deleteItemComment($itemId, $commentId) {
		//TODO permissions
		//TODO own comment/admin
		$item = $this->_getItem($itemId);
		$comment = Comment::find($commentId);
		//TODO validate comment from right item? find via comment->item?
		if ($comment != NULL) {
			$comment->item()->detach();
			$comment->delete();
		}
		return array();
	}
}