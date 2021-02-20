#!/usr/bin/env bash

function do_it () {
  local CURRENT_DIR
  local WHERE_TO_FIND_IMAGES

  CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
  WHERE_TO_FIND_IMAGES="${1:-"/home/dario/tmp/AI"}"

  "${CURRENT_DIR}/.venv/bin/make_image_classifier" \
    --image_dir "${WHERE_TO_FIND_IMAGES}/images" \
    --tfhub_module https://tfhub.dev/google/imagenet/inception_v3/feature_vector/4 \
    --saved_model_dir "${CURRENT_DIR}/../model" \
    --labels_output_file "${CURRENT_DIR}/../model/class-labels.txt" \
    --image_size=100
}

do_it "$@"
