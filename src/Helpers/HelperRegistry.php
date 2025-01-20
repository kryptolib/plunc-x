<?php 

namespace Kryptolib\PluncX\Helpers;

use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\App\MinifiedTokenRegistry;
use Kryptolib\PluncX\App\UniqueTokenRegistry;
use Kryptolib\PluncX\Handlers\HandlerName;
use Kryptolib\PluncX\Handlers\HandlerService;
use Kryptolib\PluncX\Helpers\HelperModel;

class HelperRegistry {

    private static array $HelperModels = [];

    public static function collect(){

        /** Ensures that we only look up once */
        if (HelperRegistry::has_looked_up()) return;

        $ThemeController = new ThemeController();
        $helpers_dir 
            = HandlerService::convert(
                $ThemeController->getdir() . '/helpers'
            );

        if (!\is_dir($helpers_dir)) return;
        HelperRegistry::lookup($helpers_dir);
    }

    private static function has_looked_up(): bool {
        return count(static::$HelperModels) > 0;
    }

    private static function lookup(
        string $directory
    ){
        $files = \array_diff(
            \scandir($directory), 
            ['.', '..']
        );
        foreach ($files as $file) {
            $path = $directory.'/'.$file;
            if (\is_dir($path)) {
                HelperRegistry::lookup($path);
                continue;
            }
            HelperRegistry::register($path);
        }
    }

    public static function get(): HelperIterator {
        return new HelperIterator(
            static::$HelperModels
        );
    }

    public static function find(
        string $absolute_path
    ): HelperModel {
        $result = null;
        foreach (HelperRegistry::get() as $HelperModel) {
            if ($HelperModel->absolute_path === $absolute_path) {
                $result = $HelperModel;
            }
        }
        return $result;
    }

    private static function register(
        string $path
    ){
        $absolute_path 
            = str_replace('/', "\\", $path);
        $object_name 
            = basename($path, ".js");
        $HelperName = new HandlerName(
            $object_name,
            $object_name,
            UniqueTokenRegistry::generate(
                $object_name,
                $absolute_path
            ),
            MinifiedTokenRegistry::generate()
        );
        array_push(
            static::$HelperModels,
            new HelperModel(
                $HelperName,
                $absolute_path
            )
        );
    }

}