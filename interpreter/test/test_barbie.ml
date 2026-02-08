(** Basic tests for the Barbie-lang interpreter *)

let run_source src =
  let tokens = Barbie_lib.Lexer.tokenize src in
  let ast = Barbie_lib.Parser.parse tokens in
  Barbie_lib.Eval.run ast

let test name src expected =
  let output = run_source src in
  if output = expected then
    Printf.printf "PASS: %s\n" name
  else begin
    Printf.printf "FAIL: %s\n  expected: [%s]\n  got:      [%s]\n"
      name
      (String.concat "; " expected)
      (String.concat "; " output);
    exit 1
  end

let () =
  (* Ken.say *)
  test "print string"
    "Ken.say(\"hello barbie\")\n"
    ["hello barbie"];

  (* Variables *)
  test "variable assignment and print"
    "x = 5\nKen.say(x)\n"
    ["5"];

  (* Arithmetic *)
  test "arithmetic"
    "Ken.say(2 + 3 * 4)\n"
    ["14"];

  test "exponentiation"
    "Ken.say(2 ** 3)\n"
    ["8"];

  (* Booleans *)
  test "glitter and dust"
    "Ken.say(glitter)\nKen.say(dust)\n"
    ["glitter"; "dust"];

  (* Feel/else *)
  test "feel-else true branch"
    "x = 10\nfeel x == 10:\n  Ken.say(\"yes\")\nelse:\n  Ken.say(\"no\")\n"
    ["yes"];

  test "feel-else false branch"
    "x = 5\nfeel x == 10:\n  Ken.say(\"yes\")\nelse:\n  Ken.say(\"no\")\n"
    ["no"];

  (* Strut loop *)
  test "strut loop"
    "strut i in runway(3):\n  Ken.say(i)\n"
    ["0"; "1"; "2"];

  (* Keepgoing loop with kenough *)
  test "keepgoing with kenough"
    "x = 0\nkeepgoing x < 5:\n  Ken.say(x)\n  x = x + 1\n  feel x == 3:\n    kenough\n"
    ["0"; "1"; "2"];

  (* Functions and Recursion *)
  test "recursive factorial"
    "dream fact(n):\n  feel n <= 1:\n    gift 1\n  gift n * fact(n - 1)\nKen.say(fact(5))\n"
    ["120"];

  (* Lists and Slicing *)
  test "list operations"
    "l = [1, 2, 3]\nKen.say(l[1])\nKen.say(l[0:2])\nKen.say(len(l))\n"
    ["2"; "[1, 2]"; "3"];

  (* Logical operators *)
  test "logical and/or"
    "Ken.say(glitter and dust)\nKen.say(glitter or dust)\nKen.say(not dust)\n"
    ["dust"; "glitter"; "glitter"];

  Printf.printf "\nAll tests passed!\n"
