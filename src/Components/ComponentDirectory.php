<?php 

namespace Kryptolib\PluncX\Components;

use Kenjiefx\ScratchPHP\App\Components\ComponentPaths;
use Kryptolib\PluncX\Handlers\HandlerService;

class ComponentDirectory extends ComponentPaths {

    public function __construct(
        private string $dir,
        private string $name
    ){
        parent::__construct(
            dir: $dir,
            name: $name
        );
    }

    public function handler(): string {
        return HandlerService::convert(
            jspath: $this->js()
        );
    }

}