<?php 

namespace Kryptolib\PluncX\Services;

use Kryptolib\PluncX\Handlers\HandlerName;

class ServiceModel {

    public function __construct(
        public readonly HandlerName $name,
        public readonly string $absolute_path
    ){
        
    }

}