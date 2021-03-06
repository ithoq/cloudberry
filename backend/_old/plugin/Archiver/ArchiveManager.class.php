<?php

	/**
	 * ArchiveManager.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */

	class ArchiveManager {
		private $env;
		private $compressor;
		
		function __construct($env, $compressor) {
			$this->env = $env;
			$this->compressor = $compressor;
		}
		
		/*public function storeArchive($items) {
			$id = uniqid();
			$zip = $this->createArchive($items);
			$this->env->session()->param("archive_".$id, $zip->filename());
			return $id;
		}*/
		
		private function createArchive($items) {
			$c = $this->getCompressor();
			
			if (is_array($items)) {
				$this->env->filesystem()->assertRights($items, FilesystemController::PERMISSION_LEVEL_READ, "add to package");
				
				foreach($items as $item) {
					$item->addTo($c);
				}
			} else {
				$item = $items;
				$this->env->filesystem()->assertRights($item, FilesystemController::PERMISSION_LEVEL_READ, "add to package");
				$item->addTo($c);
			}
			
			$c->finish();
			return $c;
		}
		
		public function extract($archive, $to) {
			$zip = new ZipArchive;
			if ($zip->open($archive) !== TRUE)
				throw new ServiceException("REQUEST_FAILED", "Could not open archive ".$archive);
			
			$zip->extractTo($to);
			$zip->close();
		}
		
		public function compress($items, $to = NULL) {
			$a = $this->createArchive($items);
			
			if ($to != NULL) {
				$from = $a->filename();
				copy($from, $to);
				unlink($from);
			} else
				return $a->filename();
		}

		private function getCompressor() {
			require_once('CloudberryCompressor.class.php');
			
			if ($this->compressor == NULL || strcasecmp($this->compressor, "ziparchive") === 0) {
				require_once('zip/CloudberryZipArchive.class.php');
				return new CloudberryZipArchive($this->env);
			} else if (strcasecmp($this->compressor, "native") === 0) {
				require_once('zip/CloudberryZipNative.class.php');
				return new CloudberryZipNative($this->env);
			} else if (strcasecmp($this->compressor, "raw") === 0) {
				require_once('zip/CloudberryZipRaw.class.php');
				return new CloudberryZipRaw($this->env);
			}
			
			throw new ServiceException("INVALID_CONFIGURATION", "Unsupported compressor configured: ".$this->compressor);
		}
		
		public function __toString() {
			return "ArchiverManager";
		}
	}
?>