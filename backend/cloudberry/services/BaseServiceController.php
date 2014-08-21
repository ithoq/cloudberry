<?php

namespace Cloudberry;

class BaseServiceController extends \Controller {

	/*protected function setupLayout() {
	if (!is_null($this->layout)) {
	$this->layout = View::make($this->layout);
	}
	}*/

	protected function invalidRequestJsonResponse($message = NULL) {
		return Response::json([
				'error' => true,
				'message' => $message != NULL?$message:"Invalid request"],
			403
		);
	}

	protected function unauthorizedJsonResponse() {
		return Response::json([
				'error' => true,
				'message' => 'Unauthorized Request'],
			401
		);
	}
}
