(** Token types for Barbie-lang *)

type t =
  (* Literals *)
  | INT of int
  | FLOAT of float
  | STRING of string
  | GLITTER          (* true *)
  | DUST             (* false *)
  | NONE

  (* Identifiers & keywords *)
  | IDENT of string
  | FEEL             (* if *)
  | ELIF             (* else if *)
  | ELSE
  | KEEPGOING        (* while *)
  | STRUT            (* for *)
  | SOMANYTIMES      (* repeat *)
  | IN
  | RUNWAY           (* range *)
  | KENOUGH          (* break *)
  | CONTINUE
  | PASS
  | DREAM            (* def *)
  | GIFT             (* return *)
  | KEN_SAY          (* Ken.say *)

  (* Operators *)
  | PLUS
  | MINUS
  | STAR
  | SLASH
  | DOUBLESTAR       (* ** *)
  | EQ               (* == *)
  | NEQ              (* != *)
  | LT
  | LTE
  | GT
  | GTE
  | AND
  | OR
  | NOT
  | ASSIGN           (* = *)

  (* Delimiters *)
  | LPAREN
  | RPAREN
  | LBRACKET
  | RBRACKET
  | COLON
  | COMMA
  | NEWLINE
  | INDENT
  | DEDENT
  | EOF

let to_string = function
  | INT n -> Printf.sprintf "INT(%d)" n
  | FLOAT f -> Printf.sprintf "FLOAT(%f)" f
  | STRING s -> Printf.sprintf "STRING(%s)" s
  | GLITTER -> "GLITTER"
  | DUST -> "DUST"
  | NONE -> "NONE"
  | IDENT s -> Printf.sprintf "IDENT(%s)" s
  | FEEL -> "FEEL"
  | ELIF -> "ELIF"
  | ELSE -> "ELSE"
  | KEEPGOING -> "KEEPGOING"
  | STRUT -> "STRUT"
  | SOMANYTIMES -> "SOMANYTIMES"
  | IN -> "IN"
  | RUNWAY -> "RUNWAY"
  | KENOUGH -> "KENOUGH"
  | CONTINUE -> "CONTINUE"
  | PASS -> "PASS"
  | DREAM -> "DREAM"
  | GIFT -> "GIFT"
  | KEN_SAY -> "KEN_SAY"
  | PLUS -> "PLUS"
  | MINUS -> "MINUS"
  | STAR -> "STAR"
  | SLASH -> "SLASH"
  | DOUBLESTAR -> "DOUBLESTAR"
  | EQ -> "EQ"
  | NEQ -> "NEQ"
  | LT -> "LT"
  | LTE -> "LTE"
  | GT -> "GT"
  | GTE -> "GTE"
  | AND -> "AND"
  | OR -> "OR"
  | NOT -> "NOT"
  | ASSIGN -> "ASSIGN"
  | LPAREN -> "LPAREN"
  | RPAREN -> "RPAREN"
  | LBRACKET -> "LBRACKET"
  | RBRACKET -> "RBRACKET"
  | COLON -> "COLON"
  | COMMA -> "COMMA"
  | NEWLINE -> "NEWLINE"
  | INDENT -> "INDENT"
  | DEDENT -> "DEDENT"
  | EOF -> "EOF"
