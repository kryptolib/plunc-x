<?php 

namespace Kryptolib\PluncX\Handlers;

use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\App\DependencyItem;
use Kryptolib\PluncX\App\DependencyService;
use Kryptolib\PluncX\Components\ComponentRegistry;

class HandlerService {

    /**
     * Converts a path of the javascript handler within 
     * the theme directory into its equivalent javascript   
     * handler path in dist
     * @param string $jspath to the typescript handler
     * @return string
     */
    public static function convert(
        string $jspath
    ){
        $ThemeController = new ThemeController;
        $themedir = $ThemeController->getdir();
        $themename = $ThemeController->theme()->name;
        $distloc = ROOT . '/dist/' . $themename;
        $result = str_replace(
            search: $themedir,
            replace: $distloc,
            subject: $jspath
        );
        return str_replace('/', "\\", $result);
    }

    /**
     * Determines the type of handler based on 
     * where the file is located
     * @param string $jspath
     * @return int
     */
    public static function type(
        string $jspath
    ): int {
        $ThemeController = new ThemeController;
        $themename = $ThemeController->theme()->name;
        $distloc = ROOT . '/dist/' . $themename;
        $typemap = [
            HandlerType::COMPONENT => $distloc . '/components',
            HandlerType::SERVICE   => $distloc . '/services',
            HandlerType::FACTORY   => $distloc . '/factories',
            HandlerType::HELPER    => $distloc . '/helpers',
            HandlerType::TEMPLATE  => $distloc . '/templates',
            HandlerType::PLUNCX    => $distloc . '/interfaces/pluncx.js',
        ];
        foreach ($typemap as $type => $location) {
            $location = str_replace(
                search: '/', 
                replace: "\\", 
                subject: $location
            );
            if (str_contains(
                haystack: $jspath,
                needle: $location
            )) {
                return $type;
            }
        }
        return 0;
    }

}