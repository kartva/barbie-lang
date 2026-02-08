(** Interpreter/evaluator for Barbie-lang *)

exception Runtime_error of string
exception Break_signal
exception Continue_signal

type value =
  | VNum of float
  | VStr of string
  | VBool of bool
  | VNone

type env = (string, value) Hashtbl.t

let create_env () : env = Hashtbl.create 16

let value_to_string = function
  | VNum f ->
    if Float.is_integer f then string_of_int (int_of_float f)
    else string_of_float f
  | VStr s -> s
  | VBool true -> "glitter"
  | VBool false -> "dust"
  | VNone -> "None"

let is_truthy = function
  | VBool false | VNone -> false
  | VNum f when f = 0.0 -> false
  | VStr s when s = "" -> false
  | _ -> true

let eval_binop op l r =
  match op, l, r with
  (* Arithmetic *)
  | Ast.Add, VNum a, VNum b -> VNum (a +. b)
  | Ast.Add, VStr a, VStr b -> VStr (a ^ b)
  | Ast.Sub, VNum a, VNum b -> VNum (a -. b)
  | Ast.Mul, VNum a, VNum b -> VNum (a *. b)
  | Ast.Mul, VStr s, VNum n -> VStr (String.concat "" (List.init (int_of_float n) (fun _ -> s)))
  | Ast.Div, VNum _, VNum b when b = 0.0 ->
    raise (Runtime_error "Division by zero")
  | Ast.Div, VNum a, VNum b -> VNum (a /. b)
  | Ast.Pow, VNum a, VNum b -> VNum (a ** b)
  (* Comparison *)
  | Ast.Eq, a, b -> VBool (a = b)
  | Ast.Neq, a, b -> VBool (a <> b)
  | Ast.Lt, VNum a, VNum b -> VBool (a < b)
  | Ast.Lte, VNum a, VNum b -> VBool (a <= b)
  | Ast.Gt, VNum a, VNum b -> VBool (a > b)
  | Ast.Gte, VNum a, VNum b -> VBool (a >= b)
  | _ -> raise (Runtime_error "Type error in binary operation")

(** Output buffer — collects all Ken.say output *)
let output_buffer : string list ref = ref []

let reset_output () = output_buffer := []
let get_output () = List.rev !output_buffer

let rec eval_expr (env : env) = function
  | Ast.Num f -> VNum f
  | Ast.Str s -> VStr s
  | Ast.Bool b -> VBool b
  | Ast.None -> VNone
  | Ast.Var name ->
    (match Hashtbl.find_opt env name with
     | Some v -> v
     | None -> raise (Runtime_error (Printf.sprintf "Undefined variable: %s" name)))
  | Ast.BinOp (op, left, right) ->
    let l = eval_expr env left in
    let r = eval_expr env right in
    eval_binop op l r
  | Ast.Call ("Ken.say", args) ->
    let values = List.map (eval_expr env) args in
    let text = String.concat " " (List.map value_to_string values) in
    output_buffer := text :: !output_buffer;
    print_endline text;
    VNone
  | Ast.Call (name, _) ->
    raise (Runtime_error (Printf.sprintf "Unknown function: %s" name))

let rec eval_stmt (env : env) = function
  | Ast.Assign (name, expr) ->
    let v = eval_expr env expr in
    Hashtbl.replace env name v
  | Ast.Expr e ->
    ignore (eval_expr env e)
  | Ast.Feel (branches, else_body) ->
    let rec try_branches = function
      | [] ->
        (match else_body with
         | Some body -> eval_block env body
         | None -> ())
      | (cond, body) :: rest ->
        if is_truthy (eval_expr env cond) then
          eval_block env body
        else
          try_branches rest
    in
    try_branches branches
  | Ast.Keepgoing (cond, body) ->
    (try
      while is_truthy (eval_expr env cond) do
        (try eval_block env body
         with Continue_signal -> ())
      done
     with Break_signal -> ())
  | Ast.Strut (var, count_expr, body) ->
    let count = match eval_expr env count_expr with
      | VNum f -> int_of_float f
      | _ -> raise (Runtime_error "runway() expects a number")
    in
    (try
      for i = 0 to count - 1 do
        Hashtbl.replace env var (VNum (float_of_int i));
        (try eval_block env body
         with Continue_signal -> ())
      done
     with Break_signal -> ())
  | Ast.Kenough -> raise Break_signal
  | Ast.Continue -> raise Continue_signal
  | Ast.Pass -> ()

and eval_block env stmts =
  List.iter (eval_stmt env) stmts

let run (program : Ast.program) =
  let env = create_env () in
  reset_output ();
  eval_block env program;
  get_output ()
