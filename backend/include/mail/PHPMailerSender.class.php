<?php

	/**
	 * PHPMailerSender.class.php
	 *
	 * Copyright 2008- Samuli J�rvel�
	 * Released under GPL License.
	 *
	 * License: http://www.mollify.org/license.php
	 */

	class Mollify_MailSender {
		private $env;
		private $enabled;
		
		public function __construct($env) {
			$this->env = $env;
			$this->enabled = $env->features()->isFeatureEnabled("mail_notification");
		}
		
		public function send($to, $subject, $message, $from = NULL, $attachments = NULL) {			
			if (!$this->enabled) return;
			
			$isHtml = (stripos($message, "<html>") !== FALSE);
			$f = ($from != NULL ? $from : $this->env->settings()->setting("mail_notification_from"));
			
			$validRecipients = $this->getValidRecipients($to);
			if (count($validRecipients) === 0) {
				Logging::logDebug("No valid recipient email addresses, no mail sent");
				return;
			}
			
			if (Logging::isDebug())
				Logging::logDebug("Sending mail from [".$f."] to [".Util::array2str($validRecipients)."]: [".$message."]");
			
			set_include_path("vendor/PHPMailer".DIRECTORY_SEPARATOR.PATH_SEPARATOR.get_include_path());
			require 'class.phpmailer.php';
			
			$mailer = new PHPMailer;
			
			$smtp = $this->env->settings()->setting("mail_smtp");
			if ($smtp != NULL and isset($smtp["host"])) {
				$mailer->isSMTP();
				$mailer->Host = $smtp["host"];
				
				if (isset($smtp["username"]) and isset($smtp["password"])) {
					$mailer->SMTPAuth = true;
					$mailer->Username = $smtp["username"];
					$mailer->Password = $smtp["password"];
				}
				if (isset($smtp["secure"]))
					$mailer->SMTPSecure = $smtp["secure"];
			}
			
			$mailer->From = $f;
			foreach ($validRecipients as $recipient) {
				$mailer->addBCC($recipient["email"], $recipient["name"]);
			}

			if (!$isHtml)
				$mailer->WordWrap = 50;
			else
				$mailer->isHTML(true);
			
			if ($attachments != NULL) {
				//TODO use stream
				foreach ($attachments as $attachment)
					$mailer->addAttachment($attachment);
			}
			
			$mailer->Subject = $subject;
			$mailer->Body    = $message;
			
			try {
				if(!$mailer->send()) {
					Logging::logError('Message could not be sent: '.$mailer->ErrorInfo);
					return FALSE;
				}
				return TRUE;
			} catch (Exception $e) {
				Logging::logError('Message could not be sent: '.$e);
				return FALSE;
			}
		}
		
		private function getValidRecipients($recipients) {
			$valid = array();
			foreach ($recipients as $recipient) {
				if ($recipient["email"] === NULL or strlen($recipient["email"]) == 0) continue;
				$valid[] = $recipient;
			}
			return $valid;
		}
				
		public function __toString() {
			return "Mollify_MailSender_PHPMailer";
		}
	}
?>