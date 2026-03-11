{ pkgs ? import <nixpkgs> { } }:

let
  harbor = pkgs.writeShellScriptBin "harbor" ''
    exec ${pkgs.uv}/bin/uv tool run --from harbor harbor "$@"
  '';
in
pkgs.mkShell {
  packages = with pkgs; [
    uv
    nodejs_22
    harbor
  ];
}
