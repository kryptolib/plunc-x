<?php 

namespace Kryptolib\PluncX\App;

class DependencyItem {

    public function __construct(
        public readonly string $abspath,
        public readonly string $filename,
        public readonly int $type,
        public readonly string $content
    ){

    }

}