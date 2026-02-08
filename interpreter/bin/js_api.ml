open Js_of_ocaml

let run_barbie source =
  try
    let tokens = Barbie_lib.Lexer.tokenize (Js.to_string source) in
    let ast = Barbie_lib.Parser.parse tokens in
    let output = Barbie_lib.Eval.run ast in
    let output_js = List.map Js.string output |> Array.of_list |> Js.array in
    Js.Unsafe.obj [|
      ("ok", Js.Unsafe.inject Js._true);
      ("output", Js.Unsafe.inject output_js);
      ("error", Js.Unsafe.inject Js.null);
    |]
  with
  | Barbie_lib.Lexer.Lexer_error msg ->
    Js.Unsafe.obj [|
      ("ok", Js.Unsafe.inject Js._false);
      ("output", Js.Unsafe.inject (Js.array [||]));
      ("error", Js.Unsafe.inject (Js.some (Js.string ("Lexer error: " ^ msg))));
    |]
  | Barbie_lib.Parser.Parse_error msg ->
    Js.Unsafe.obj [|
      ("ok", Js.Unsafe.inject Js._false);
      ("output", Js.Unsafe.inject (Js.array [||]));
      ("error", Js.Unsafe.inject (Js.some (Js.string ("Parse error: " ^ msg))));
    |]
  | Barbie_lib.Eval.Runtime_error msg ->
    Js.Unsafe.obj [|
      ("ok", Js.Unsafe.inject Js._false);
      ("output", Js.Unsafe.inject (Js.array [||]));
      ("error", Js.Unsafe.inject (Js.some (Js.string ("Runtime error: " ^ msg))));
    |]
  | e ->
    Js.Unsafe.obj [|
      ("ok", Js.Unsafe.inject Js._false);
      ("output", Js.Unsafe.inject (Js.array [||]));
      ("error", Js.Unsafe.inject (Js.some (Js.string ("Unknown error: " ^ Printexc.to_string e))));
    |]

let () =
  Js.Unsafe.set Js.Unsafe.global (Js.string "BarbieInterpreter")
    (object%js
       method run source = run_barbie source
     end)
