<?php 

namespace Kryptolib\PluncX\Helpers;

use Kryptolib\PluncX\Handlers\HandlerName;

class HelperModel {

    public function __construct(
        public readonly HandlerName $name,
        public readonly string $absolute_path
    ){
        
    }

}