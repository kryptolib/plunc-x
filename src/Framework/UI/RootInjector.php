<?php 

namespace Kryptolib\PluncX\Framework\UI;

class RootInjector {
    public const COLOR_CONFIG_FILE_NAME = 'color.json';

    public const STATIC_DIMENSIONS_FILE_NAME = 'statics.json';

    public static function collect (string $themedir, string $csscode){
        
        $cssvars = [];

        $ventadir = $themedir.'/venta/';
        if (!\is_dir($ventadir)) return $csscode;

        foreach (scandir($ventadir) as $file) {
            if ($file==='.'||$file==='..') continue;

            $path = $ventadir.$file;
            if (is_dir($path)) {

                $themename = $file;
                foreach (scandir($path) as $themedfile) {
                    if ($themedfile === '.' || $themedfile === '..' ) continue;
                    $themedfilepath = $path.'/'.$themedfile;
                    if ($themedfile === self::COLOR_CONFIG_FILE_NAME) {
                        $configs = json_decode(file_get_contents($themedfilepath),TRUE);
                        foreach (self::color($themename,$configs) as $key => $value) {
                            $cssvars[$key] = $value;
                        }
                    }
                }
            } else {
                if ($file === self::COLOR_CONFIG_FILE_NAME) {
                    $configs = json_decode(file_get_contents($path),TRUE);
                    foreach (self::color('default',$configs) as $key => $value) {
                        $cssvars[$key] = $value;
                    }
                }
                if ($file === self::STATIC_DIMENSIONS_FILE_NAME) {
                    $configs = json_decode(file_get_contents($path),TRUE);
                    foreach (self::statics($configs) as $key => $value) {
                        $cssvars[$key] = $value;
                    }
                }
            }
        }
        
        $root = '';
        foreach ($cssvars as $key => $value) {
            if (str_contains($csscode,$key)) {
                $root = $root.$key.':'.$value.';';
            }
        }
        return $root;
    }

    private static function color(string $themeName,array $configs){
        $varNames = [];
        foreach ($configs as $selector => $data) {
            $values = $data['values'];
            foreach ($values as $key => $colorCode) {
                $varName = '--'.$themeName.'-'.$selector.'-'.$key;
                $varNames[$varName] = $colorCode;
            }
        }
        return $varNames;
    }

    private static function statics(array $configs){
        $varNames = [];
        foreach ($configs as $selector => $data) {
            $values = $data['values'];
            foreach ($values as $key => $colorCode) {
                $varName = '--'.$selector.'-'.$key;
                $varNames[$varName] = $colorCode;
            }
        }
        return $varNames;
    }
}