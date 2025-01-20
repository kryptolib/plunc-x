<?php 

namespace Kryptolib\PluncX\Framework;

use Kenjiefx\ScratchPHP\App\Build\BuildEventDTO;
use Kryptolib\PluncX\Handlers\HandlerService;
use Kryptolib\PluncX\App\DependencyRegistry;
use Kryptolib\PluncX\App\DependencyService;

class AppService {

    public static function collect(
        BuildEventDTO $BuildEventDTO,
        DependencyRegistry $DependencyRegistry
    ){
        $template    = $BuildEventDTO->PageController->template()->TemplateModel->name;
        $template_js = $BuildEventDTO->PageController->template()->getdir() . $template . '.js';
        $template_js = HandlerService::convert($template_js);
        $content = file_get_contents($template_js);
        $DependencyRegistry->register(
            $template_js,
            $content
        );
        DependencyService::lookup(
            DependencyRegistry: $DependencyRegistry,
            content: $content,
            jspath: $template_js
        );

    }

}