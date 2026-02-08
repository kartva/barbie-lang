(** Barbie-lang interpreter entry point *)

let () =
  if Array.length Sys.argv < 2 then begin
    Printf.eprintf "Usage: barbie <file.barbie>\n";
    exit 1
  end;
  let filename = Sys.argv.(1) in
  let source = In_channel.with_open_text filename In_channel.input_all in
  try
    let tokens = Barbie_lib.Lexer.tokenize source in
    let ast = Barbie_lib.Parser.parse tokens in
    ignore (Barbie_lib.Eval.run ast)
  with
  | Barbie_lib.Lexer.Lexer_error msg ->
    Printf.eprintf "Lexer error: %s\n" msg;
    exit 1
  | Barbie_lib.Parser.Parse_error msg ->
    Printf.eprintf "Parse error: %s\n" msg;
    exit 1
  | Barbie_lib.Eval.Runtime_error msg ->
    Printf.eprintf "Runtime error: %s\n" msg;
    exit 1
